
// OpenAI interaction functions for the appointment assistant

/**
 * Prepares conversation messages for the OpenAI API
 */
export function prepareConversationMessages(message: string, history: any[] = [], context: any, settings: any, dateContext?: string) {
  // Create the system message with context
  // Use custom system prompt if available, otherwise use default
  let systemContent = settings?.system_prompt || 
    `You are an AI appointment assistant for a hair salon. Your job is to help clients with appointments and answer questions about the salon's services.

Be friendly, professional, and concise in your responses. Use information about the salon and services when available.`;

  // Add salon context if available
  if (context?.salon) {
    systemContent += `\n\nSalon information:
- Name: ${context.salon.name}
- Location: ${context.salon.location || 'Not specified'}
- Contact: ${context.salon.phone || 'Not specified'} / ${context.salon.email || 'Not specified'}`;
  }
  
  // Add stylist context if available
  if (context?.stylist) {
    systemContent += `\n\nSelected stylist:
- Name: ${context.stylist.name}
- Expertise: ${context.stylist.expertise ? context.stylist.expertise.join(', ') : 'Various services'}
- Bio: ${context.stylist.bio || 'Not provided'}`;
  }
  
  // Add services context if available
  if (context?.services && context.services.length > 0) {
    systemContent += `\n\nAvailable services:`;
    context.services.forEach((service: any) => {
      systemContent += `\n- ${service.name}: ${service.description || 'No description'} (Duration: ${service.duration} min, Price: $${service.price})`;
    });
  }

  // Add custom services list if available
  if (settings?.services_list && settings.services_list.trim() !== '') {
    systemContent += `\n\nAdditional service information:
${settings.services_list}`;
  }
  
  // Add date context if available
  if (dateContext) {
    systemContent += `\n\nCurrent calendar view: ${dateContext}`;
  }
  
  // Prepare the messages array with system message
  const messages = [
    { role: "system", content: systemContent }
  ];
  
  // Add conversation history
  if (history && history.length > 0) {
    messages.push(...history);
  }
  
  // Add the current user message
  messages.push({ role: "user", content: message });
  
  return messages;
}

/**
 * Processes the message with OpenAI API
 */
export async function processWithOpenAI(messages: any[], apiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}
