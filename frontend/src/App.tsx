import { version } from '../package.json'

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">TrailWise OK</h1>
        <p className="text-gray-600">Version: {version}</p>
      </div>
    </div>
  )
}

export default App

