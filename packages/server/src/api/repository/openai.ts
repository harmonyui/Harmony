import { getTextInBetween } from '@harmony/util/src/utils/common'
import OpenAI from 'openai'
import { z } from 'zod'
import { getCacheItem, setCacheItem } from './cache/redis'

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
    type: 'json',
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
    type: 'json',
  })

  return response
}

export const refactorTailwindClasses = async (
  css: string,
  elements: string,
): Promise<string> => {
  const prompt = `### Task: Convert the provided JSX and CSS rules into Tailwind CSS equivalents.
### Input: 

\`\`\`css
${css}
\`\`\`
\`\`\`jsx
${elements}
\`\`\`

### Requirements: 
1. Convert all CSS rules into their corresponding Tailwind CSS classes. 
2. For parent-child relationships with pseudo-classes (e.g., \`hover\`, \`focus\`), use Tailwind’s \`group\` or \`group-hover\` utilities. 
3. Ensure all styles, including states, responsive classes, and complex selectors, are retained. The original css classes should not be retained.
4. Maintain the original structure of the JSX; only replace class names. Do not add any text elements or element attributes.
5. Make sure that complex css selectors map to the correct JSX element for that style. Do not assume that a style applies to all elements of a certain type.

### Tailwind Class Mapping Examples: 
- \`opacity: 0\` → \`opacity-0\` 
- \`:hover\` → \`hover:\`
- \`.container:hover .item\` → Use \`group\` and \`group-hover\`. 
- \`.container:hover > div + div\` -> Use \`group\` and \`group-hover\` on the second sibling div element that is a child of container
- \`.container > div:first-child {opacity-0}\` -> Use tailwind classes only on first div that is a child of container

### Output: Return the refactored JSX code only. Do not include additional text.`
  const context =
    'You are a frontend web developer tasked with refactoring React code to use tailwind classes.'

  const response = await generateFromPrompt<string>({
    prompt,
    context,
    responseSchema: z.string(),
    type: 'jsx',
  })

  return response
}

/**
 * Generates a response from a prompt and context and caches it
 * @param param0 - prompt, context, responseSchema, type
 * @returns
 */
const generateFromPrompt = async <Response>({
  prompt,
  context,
  responseSchema,
  type,
}: {
  prompt: string
  context: string
  type: 'json' | 'jsx'
  responseSchema: z.ZodType<Response>
}): Promise<Response> => {
  const cacheResponse = await getCacheResponse(prompt, context)
  const message =
    cacheResponse ?? (await generateOpeanAIResponse(prompt, context))
  const result = responseSchema.parse(
    type === 'json'
      ? JSON.parse(getTextInBetween(message, '```json', '```'))
      : getTextInBetween(message, `\`\`\`${type}`, '```'),
  )

  if (!cacheResponse) {
    const key = `${prompt}${context}`
    await setCacheItem(key, message)
  }

  return result
}

const generateOpeanAIResponse = async (
  prompt: string,
  context: string,
): Promise<string> => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
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
    return response.choices[0].message.content
  }

  throw new Error('Invalid response from openai')
}

const getCacheResponse = (
  prompt: string,
  context: string,
): Promise<string | null> => {
  const key = `${prompt}${context}`
  return getCacheItem(key)
}
