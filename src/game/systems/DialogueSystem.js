export class DialogueSystem {
  constructor(scene) {
    this.scene = scene
    this.active = false
    this.onDialogueStart = null
    this.onDialogueEnd = null
  }

  showDialogue(dialogueData) {
    this.active = true
    this.scene.physics.pause()

    if (this.onDialogueStart) {
      this.onDialogueStart(dialogueData)
    }
  }

  handleChoice(choiceIndex, result) {
    this.active = false
    this.scene.physics.resume()

    if (this.onDialogueEnd) {
      this.onDialogueEnd(choiceIndex, result)
    }
  }

  isActive() {
    return this.active
  }
}
