import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import './index.css'

function App() {
  return React.createElement('div', null, 
    React.createElement('h1', null, 'Sistema de Gestión'),
    React.createElement('p', null, 'React funcionando correctamente'),
    React.createElement('button', { 
      onClick: () => window.location.reload(),
      style: { padding: '8px 16px', marginTop: '16px' }
    }, 'Test Button')
  )
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(React.createElement(App))
