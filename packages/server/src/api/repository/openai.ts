import { replaceAll } from '@harmony/util/src/utils/common'
import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI()

export const updateAttributeSchema = z.object({
  name: z.string(),
  value: z.string(),
})
export type UpdateAttribute = z.infer<typeof updateAttributeSchema>

export const generateUpdatesFromText = async (
  text: string,
  currentAttributes: UpdateAttribute[],
): Promise<UpdateAttribute[]> => {
  const prompt = `You are given a list of css properties with their current values and a user's input. Given the input, return a list of command objects that specify how to go from the current values to the new css values. The command object should be json with this schema: {"name": "<css property>", value: "<new css property value>"}. Make sure and return your results in json according to the schema.

Current Properties:
${currentAttributes.map((attr) => `${attr.name}: ${attr.value}`).join('\n')}

Input: ${text}`
  const context =
    'You are a frontend web developer tasked with giving json update commands to an element based on input from a user.'

  const newValues = await generateFromPrompt<UpdateAttribute[]>({
    prompt,
    context,
    responseSchema: z.array(updateAttributeSchema),
  })

  return newValues
}

export const transformCssToTailwindConfigSchema = z.object({
  'theme.extend.animation': z.record(z.string()),
  'theme.extend.keyframes': z.record(z.unknown()),
  classes: z.string(),
})
export type TransformedTailwindConfig = z.infer<
  typeof transformCssToTailwindConfigSchema
>
export const generateTailwindAnimations = async (
  css: string,
): Promise<TransformedTailwindConfig> => {
  const prompt = `Transform this css that describes an animation from a stylesheet to tailwind styles. Give your answer as a JSON result gives information about both the values needed to update the theme.extend in the tailwind config file and also the tailwind classes used for the animation. The JSON format should look like this: {"theme.extend.animation": {"<animation-key>": "<animation-value>", ...}, "theme.extend.keyframes": {"<keyframes-key>": {...}, ...}, "classes": "..."}. Only respond in JSON. \n \`${css}\``
  const context =
    'You are a frontend web developer tasked with converting css animations to tailwind animations.'

  const response = await generateFromPrompt({
    prompt,
    context,
    responseSchema: transformCssToTailwindConfigSchema,
  })

  return response
}

const generateFromPrompt = async <Response>({
  prompt,
  context,
  responseSchema,
}: {
  prompt: string
  context: string
  responseSchema: z.ZodType<Response>
}): Promise<Response> => {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: context,
      },
      { role: 'user', content: prompt },
    ],
  })
  if (
    response.choices[0].finish_reason === 'stop' &&
    response.choices[0].message.content
  ) {
    return responseSchema.parse(
      JSON.parse(
        replaceAll(
          response.choices[0].message.content.replace('json', ''),
          '```',
          '',
        ),
      ),
    )
  }

  throw new Error('Invalid response from openai')
}
