export class Logger {
  constructor() {
    this.audioTranslation = { start: null, finish: null, total: null, input: null, output: null };
    this.intent = { start: null, finish: null, total: null, input: null, output: null };
    this.response = {
      start: null,
      finish: null,
      total: null,
      input: null,
      output: null
    };

    this.dialogSystem = { intent: this.intent, response: this.response };
    this.textTranslation = { start: null, finish: null, total: null, input: null, output: null };
    this.action = null;

    this.modules = [this.audioTranslation, this.intent, this.response, this.textTranslation];

    this.outputObjectAgent = {
      action: "dialog_system",
      components: [
        { audio_translation: this.audioTranslation },
        { dialog_system: this.dialogSystem },
        { text_translation: this.textTranslation }
      ]
    };

    this.outputObjectUser = {
      action: "translation",
      audio_translation: this.audioTranslation
    };
  }

  Log() {
    this.modules.forEach(module => {
      if (module.start && module.finish) {
        module.total = module.finish - module.start;
        delete module.start;
        delete module.finish;
      }
    });

    if (this.action === "dialog_system") console.log("pilot_record", JSON.stringify(this.outputObjectAgent));
    else if (this.action === "translation") console.log("pilot_record", JSON.stringify(this.outputObjectUser));

    this.audioTranslation = { start: null, finish: null, total: null, input: null, output: null };
    this.intent = { start: null, finish: null, total: null, input: null, output: null };
    this.response = {
      start: null,
      finish: null,
      total: null,
      input: null,
      output: null
    };
    this.userLanguage = null;
    this.targetLanguage = null;
    this.dialogSystem = { intent: this.intent, response: this.response };
    this.textTranslation = { start: null, finish: null, total: null, input: null, output: null };
    this.action = null;

    this.modules = [this.audioTranslation, this.intent, this.response, this.textTranslation];

    this.outputObjectAgent = {
      action: "dialog_system",
      components: [
        { audio_translation: this.audioTranslation },
        { dialog_system: this.dialogSystem },
        { text_translation: this.textTranslation }
      ]
    };

    this.outputObjectUser = {
      action: "translation",
      audio_translation: this.audioTranslation
    };
  }
}
