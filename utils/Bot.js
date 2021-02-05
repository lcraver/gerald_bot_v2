let Ware = require('ware');
class Bot {
  constructor(Brain) {
    this.brain = Brain;
    this.startCommands = [];
    this.tickCommands = [];
    this.middleware = Ware();
    this.client = null;
  }
  listen(client, triggerName) {
    this.client = client;
    this.client[triggerName]((message) => {
      this.middleware.run(this, message);
    });
  }
  say(message) {
    this.client.sendMessage(message);
  }
  start() {
    this.run(this.startCommands);
    this.tick();
  }
  onStart(command) {
    this.startCommands.push(command);
  }
  onTick(command) {
    this.tickCommands.push(command);
  }
  tick() {
    console.log("-- Update Tick --");
    this.run(this.tickCommands);
    let commandCycle = Settings.getSetting('coreApp', 'app_cycle');
    setTimeout(this.tick, commandCycle * 1000);
  }
  //tail recursively handle lists of functions
  use(commands) {
    if (typeof (commands) === "array" || typeof (commands) === "function")
      this.middleware.use(commands);
  }
  run(commands = []) {
    commands.forEach((command) => {
      command(this);
    });
  }
}
module.exports = Bot;
