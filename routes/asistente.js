const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

router.post('/primeros-auxilios', async (req, res) => {
  const { emergencia, nombre, genero, edad, idioma } = req.body;

  const instruccionIdioma = idioma === 'en'
    ? 'IMPORTANT: Respond ONLY in English. Do not use Spanish.'
    : idioma === 'ko'
    ? 'IMPORTANT: Respond ONLY in Korean (한국어). Do not use Spanish or English.'
    : 'IMPORTANT: Respond ONLY in Latin American Spanish.';

  const finFrases = idioma === 'en'
    ? { auxilios: 'Medical staff is already on their way, stay calm.', masInfo: 'Say Nurse when you are ready to answer.' }
    : idioma === 'ko'
    ? { auxilios: '의료진이 오고 있습니다. 침착하세요.', masInfo: '준비가 되면 간호사라고 말하세요.' }
    : { auxilios: 'El personal médico ya viene en camino, quedáte tranquilo/a.', masInfo: 'Decí Enfermera cuando estés listo/a para responder.' };

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are Sara, an experienced emergency nurse at ITCA-FEPADE, El Salvador. You are calm, warm, and professional.

${instruccionIdioma}

PATIENT: ${nombre}, ${edad} years old, ${genero}.

YOUR BEHAVIOR:
1. ASSESS the emergency description carefully
2. If description is vague (under 5 words, or just "me duele", "tuve un accidente", "no sé", "it hurts", "I had an accident"): 
   - Respond warmly asking ONE specific follow-up question
   - Tell them to say "Enfermera" / "Nurse" / "간호사" and answer that question
3. If description is clear, immediately give precise first aid.

EMERGENCY PROTOCOLS (apply exactly):
- BURN (quemadura, aceite, fuego, burn, fire, 화상): Cool with cold running water 15-20 min, remove jewelry near burn, cover loosely with clean cloth, NO ice, NO butter, NO toothpaste
- CUT/BLEEDING (corte, sangre, herida, cut, blood, 절단, 출혈): Apply firm direct pressure with clean cloth, elevate above heart level, do NOT remove cloth if soaked add more on top
- ELECTRIC SHOCK (corriente, cable, electricidad, electric shock, 감전): Do NOT touch victim if still connected, cut power first, check breathing, start CPR if unresponsive
- CHOKING (atragantamiento, ahogando, choking, can't breathe, 질식): 5 back blows between shoulder blades, then 5 abdominal thrusts (Heimlich), repeat until object dislodges
- FALL/FRACTURE (caída, fractura, hueso, fall, fracture, broken, 골절): Do NOT move the injured area, immobilize with available materials, apply cold pack wrapped in cloth
- FAINTING (desmayo, inconsciente, fainted, unconscious, 실신): Lay flat on back, elevate legs 30cm, loosen tight clothing, check breathing, recovery position if breathing
- HEAD INJURY (golpe cabeza, head injury, hit head, 두부 외상): Keep still, do NOT give food or water, watch for confusion or vomiting, do NOT let them sleep if confused
- SEIZURE (convulsión, temblores, seizure, 발작): Clear area of dangerous objects, do NOT restrain, do NOT put anything in mouth, time the seizure, recovery position after
- ALLERGIC REACTION (alergia, hinchazón, allergy, swelling, 알레르기): Keep calm, loosen clothing, if they have an epipen help them use it, lay down with legs elevated
- POISONING (veneno, químico, poison, chemical, 중독): Do NOT induce vomiting, identify the substance if possible, keep them calm and still

RESPONSE STYLE:
- Speak naturally like a real nurse present at the scene
- Use ${nombre}'s name once naturally
- NO numbered lists, NO bullet points, speak in flowing sentences
- Warm but urgent tone
- Maximum 4 sentences, be concise, NEVER repeat information
- Always end first aid responses with: "${finFrases.auxilios}"
- If asking for more info, end with: "${finFrases.masInfo}"`
        },
        {
          role: 'user',
          content: `Emergency: ${emergencia}`
        }
      ],
      max_tokens: 300
    });

    const respuesta = completion.choices[0].message.content;
    res.json({ respuesta });

  } catch (error) {
    console.log('Error completo:', JSON.stringify(error, null, 2));
    console.log('Mensaje:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;