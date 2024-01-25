const agentGreetingPhrases = {
  english: [
    "Hello! How can I assist you today?",
    "Hi there! I'm here to help. What do you need assistance with?",
    "Welcome! What can I help you with right now?",
    "Hi! Ready for some assistance? Just let me know what you need",
    "Greetings! I'm at your service. What can I do for you today?",
    "Hello! I'm here and ready to help. What can I do to assist you?"
  ],
  greek: [
    "Γεια! Πώς μπορώ να σας βοηθήσω σήμερα;",
    "Γεια σας! Είμαι εδώ για να βοηθήσω. Σε τι χρειάζεστε βοήθεια;",
    "Καλως ήρθατε! Πως θα μπορούσα να σας βοηθήσω;",
    "Γεια! Θέλετε κάποια βοήθεια; Απλά ενημερώστε με για το τι χρειάζεστε",
    "Γεια σας! Είμαι στην υπηρεσία σας. Τι μπορώ να κάνω για εσάς σήμερα;",
    "Γειά σας! Είμαι εδώ και έτοιμος να βοηθήσω. Τι μπορώ να κάνω για να σας βοηθήσω;"
  ],
  spanish: [
    "¡Hola! ¿En qué puedo ayudarte hoy?",
    "¡Hola! Estoy aquí para ayudarte. ¿Con qué necesitas ayuda?",
    "¡Bienvenido! ¿En qué puedo ayudarte ahora mismo?",
    "¡Hola! ¿Estás listo para recibir ayuda? Solo déjame saber lo que necesitas?",
    "¡Saludos! Estoy a sus ordenes. ¿Qué puedo hacer por usted hoy?",
    "¡Hola! Estoy aquí y listo para ayudar. ¿Qué puedo hacer para ayudarte?"
  ],
  italian: [
    "Ciao! Come posso aiutarti oggi?",
    "Ciao! Sono qui per aiutarti. Di cosa hai bisogno?",
    "Benvenuto! In cosa posso aiutarti in questo momento?",
    "Ciao! Sei pronto per ricevere assistenza? Fammi solo sapere di cosa hai bisogno?",
    "Saluti! Sono al tuo servizio. Cosa posso fare per te oggi",
    "Ciao! Sono qui e pronto ad aiutarti. Cosa posso fare per aiutarti?"
  ],
  dutch: [
    "Hallo! Hoe kan ik u vandaag helpen?",
    "Hallo daar! Ik ben hier om te helpen. Waar heb je hulp bij nodig?",
    "Welkom! Waar kan ik je nu mee helpen?",
    "Hallo! Klaar voor hulp? Laat me gewoon weten wat je nodig hebt?",
    "Gegroet! Ik sta tot uw dienst. Wat kan ik vandaag voor u doen",
    "Hallo! Ik ben hier en klaar om te helpen. Wat kan ik doen om u te helpen?"
  ],
  german: [
    "Hallo! Wie kann ich Ihnen heute helfen?",
    "Hallo! Ich bin hier, um Ihnen zu helfen. Wobei benötigen Sie Hilfe?",
    "Willkommen! Womit kann ich Ihnen gerade helfen?",
    "Hallo! Sind Sie bereit für Hilfe? Sagen Sie mir einfach, was Sie brauchen?",
    "Grüße! Ich bin für Sie da. Was kann ich heute für Sie tun?",
    "Hallo! Ich bin hier und bereit zu helfen. Was kann ich tun, um Ihnen zu helfen?"
  ]
};

const agentAnythingElse = {
  english: [
    "Is there anything else I can assist you with?",
    "Need assistance with anything else?",
    "Is there anything else I can do for you today?",
    "Anything else you'd like assistance with right now?",
    "If there's anything else you require assistance with, feel free to ask."
  ],
  greek: [
    "Υπάρχει κάτι άλλο με το οποίο μπορώ να σας βοηθήσω;",
    "Χρειάζεστε βοήθεια με οτιδήποτε άλλο;",
    "Υπάρχει κάτι άλλο που μπορώ να κάνω για εσάς σήμερα;",
    "Κάτι άλλο με το οποίο θα θέλατε βοήθεια αυτή τη στιγμή;",
    "Αν υπάρχει κάτι άλλο για το οποίο χρειάζεστε βοήθεια, μη διστάσετε να ρωτήσετε."
  ],
  spanish: [
    "¿Hay algo más con que te puedo ayudar?",
    "¿Necesitas ayuda con algo más?",
    "¿Hay algo más que pueda hacer por ti hoy?",
    "¿Algo más con lo que quieras ayuda ahora mismo?",
    "Si hay algo más con lo que necesitas ayuda, no dudes en preguntar"
  ],
  italian: [
    "C'è qualcos'altro in cui posso aiutarti",
    "Hai bisogno di assistenza per qualcos'altro?",
    "C'è qualcos'altro che posso fare per te oggi?",
    "C'è qualcos'altro per cui vorresti assistenza in questo momento?",
    "Se c'è qualcos'altro per cui hai bisogno di assistenza, non esitare a chiedere."
  ],
  dutch: [
    "Kan ik je nog ergens mee helpen?",
    "Heb je nog ergens hulp bij nodig?",
    "Kan ik vandaag nog iets voor je doen?",
    "Is er nog iets waar je op dit moment hulp bij zou willen hebben?",
    "Als je nog iets anders nodig hebt, vraag het dan gerust."
  ],
  german: [
    "Gibt es noch etwas, womit ich Ihnen behilflich sein kann?",
    "Benötigen Sie sonst noch Hilfe?",
    "Kann ich heute noch etwas für Sie tun?",
    "Gibt es sonst noch etwas, bei dem Sie jetzt Hilfe benötigen?",
    "Wenn Sie sonst noch Hilfe benötigen, fragen Sie einfach nach."
  ]
};

const agentSuccessfulInstruction = {
  english: [
    "Congratulations, you've arrived at your destination!",
    "Great job, you've reached your destination!",
    "You've successfully arrived! ",
    "Mission accomplished!",
    "You're there!"
  ],
  greek: [
    "Συγχαρητήρια, φτάσατε στον προορισμό σας!",
    "Μπράβο, φτάσατε στον προορισμό σας!",
    "Φτάσατε με επιτυχία!",
    "Η αποστολή ολοκληρώθηκε!",
    "Είστε εδώ!"
  ],
  spanish: [
    "¡Felicitaciones, has llegado a tu destino!",
    "¡Buen trabajo, has llegado a tu destino!",
    "¡Has llegado exitosamente!",
    "¡Misión cumplida!",
    "¡Estás ahí!"
  ],
  italian: [
    "Congratulazioni, sei arrivato a destinazione!",
    "Ottimo lavoro, hai raggiunto la tua destinazione! ",
    "Sei arrivato con successo!",
    "Missione compiuta!",
    "Ci sei!"
  ],
  dutch: [
    "Gefeliciteerd, je bent op je bestemming aangekomen!",
    "Goed gedaan, je hebt je bestemming bereikt!",
    "Je bent succesvol aangekomen!",
    "Missie volbracht!",
    "Je bent er!"
  ],
  german: [
    "Herzlichen Glückwunsch, Sie sind am Ziel angekommen!",
    "Großartige Arbeit, Sie haben Ihr Ziel erreicht!",
    "Sie sind erfolgreich angekommen!",
    "Mission erfüllt!",
    "Sie sind da!"
  ]
};

const agentInstructionsCleared = {
  english: ["Instructions cleared!"],
  greek: ["Οι οδηγίες διαγράφηκαν"],
  spanish: ["Instrucciones borradas"],
  italian: ["Istruzioni cancellate"],
  dutch: ["Instructies gewist"],
  german: ["Anweisungen gelöscht"]
};

export const agentDialogs = {
  greetings: agentGreetingPhrases,
  success: agentSuccessfulInstruction,
  cleared: agentInstructionsCleared,
  anythingElse: agentAnythingElse
};
