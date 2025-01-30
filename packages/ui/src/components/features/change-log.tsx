import { displayDateFull } from '@harmony/util/src/utils/common'
import { ChangeLog } from '@harmony/util/src/types/change-log'
import { Header } from '../core/header'

export interface ChangeLogListProps {
  items: ChangeLog[]
}
export const ChangeLogList: React.FunctionComponent<ChangeLogListProps> = ({
  items,
}) => {
  return (
    <div className='flex flex-col gap-4'>
      {items.map((item) => (
        <ChangeLogItem changeLog={item} />
      ))}
    </div>
  )
}

export interface ChangeLogItemProps {
  changeLog: ChangeLog
}
export const ChangeLogItem: React.FunctionComponent<ChangeLogItemProps> = ({
  changeLog,
}) => {
  const { version, bugs, features, releaseDate } = changeLog

  const bugList: string[] = bugs
    .split('\n')
    .filter((bug) => bug.trim().length > 0)
  const featureList: string[] = features
    .split('\n')
    .filter((feature) => feature.trim().length > 0)
  return (
    <div className='w-full bg-white p-4 rounded-md'>
      <div className='flex pb-2 border-b justify-between'>
        <Header level={3}>Version {version}</Header>
        <Header level={3}>Released {displayDateFull(releaseDate)}</Header>
      </div>
      <div>
        {featureList.length > 0 ? (
          <div>
            <Header level={4}>Features:</Header>
            <ul className='list-disc ml-8'>
              {featureList.map((feature) => (
                <li>{feature}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {bugList.length > 0 ? (
          <div>
            <Header level={4}>Bugs:</Header>
            <ul className='list-disc ml-8'>
              {bugList.map((bug) => (
                <li>{bug}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}
