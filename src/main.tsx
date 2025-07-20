import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const App = () => createElement('div', null, 
  createElement('h1', null, 'Sistema de Gestión'),
  createElement('p', null, 'React funcionando correctamente'),
  createElement('button', { 
    onClick: () => window.location.reload(),
    style: { padding: '8px 16px', marginTop: '16px' }
  }, 'Test Button')
)

const root = createRoot(document.getElementById('root')!)
root.render(createElement(App))
