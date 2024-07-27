import ReactDOM from 'react-dom'
import { HarmonySetup } from 'harmony-ai-editor/src'
import 'harmony-ai-editor/src/global.css'

ReactDOM.render(
  <HarmonySetup repositoryId='' local />,
  document.getElementById('harmony'),
)
