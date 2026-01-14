import { Scene } from './components/Scene'

function App() {
  // Boxing Gloves preset - hardcoded (removed Leva controls)
  const settings = {
    // Ball/Glove appearance
    color: '#8b0000',
    metalness: 0.1,
    roughness: 0.6,
    envMapIntensity: 0.4,
    radius: 0.35,
    
    // Physics
    mass: 3,
    restitution: 0.1,
    friction: 0.3,
    linearDamping: 1.0,
    gravity: -60,
    springStrength: 800,
    
    // String
    stringLength: 2.5,
    stringThickness: 0.018,
    stringColor: '#d4a574',
    ropeDamping: 0.92,
  }

  return <Scene settings={settings} />
}

export default App
