import * as ReactTreePrimitive from 'react-arborist'

export const Tree: React.FunctionComponent = () => {
  return (
    <ReactTreePrimitive.Tree
      initialData={[
        {
          id: '1',
          name: 'Hello',
          children: [
            {
              id: '2',
              name: 'Good bye',
            },
          ],
        },
        {
          id: '3',
          name: 'Good night',
        },
      ]}
    />
  )
}
