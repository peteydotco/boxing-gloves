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
    
    // Physics (tuned for lightweight rearview-mirror ornament feel)
    mass: 0.9,
    restitution: 0.28,
    friction: 0.45,
    linearDamping: 0.22,
    gravity: -18,
    springStrength: 140,
    
    // String
    stringLength: 2.5,
    stringThickness: 0.018,
    stringColor: '#d4a574',
    // Rope damping used by the spring constraint (higher = more damped)
    ropeDamping: 0.9,
  }

  return <Scene settings={settings} />
}

export default App
