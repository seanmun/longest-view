// Virtual input singleton — bridges React touch controls to Phaser game loop
const VirtualInput = {
  // Directional
  left: false,
  right: false,
  up: false,
  down: false,

  // Action buttons
  actionA: false,   // charge/throw (maps to space)
  actionB: false,   // jump

  // Whether mobile controls are active
  isMobile: false,

  // Reset all inputs (call on blur/visibility change)
  resetAll() {
    this.left = this.right = this.up = this.down = false
    this.actionA = this.actionB = false
  }
}

// Release all inputs when app loses focus
document.addEventListener('visibilitychange', () => {
  if (document.hidden) VirtualInput.resetAll()
})
window.addEventListener('blur', () => VirtualInput.resetAll())

window.__virtualInput = VirtualInput
export default VirtualInput
