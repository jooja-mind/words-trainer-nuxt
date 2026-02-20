export async function ask<T>({
  systemPrompt,
  triggerPrompt,
  model = 'gpt-5.2',
  reasoningEffort = 'high',
  webSearch = false,
  jsonSchema
}: {
  systemPrompt: string,
  triggerPrompt: string,
  model?: string,
  reasoningEffort?: 'none' | 'low' | 'medium' | 'high',
  webSearch?: boolean,
  jsonSchema: any
}): Promise<T> {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY missing' });

  let requestBody = {
    model,
    input: [
      {
        "role": "developer",
        "content": [
          {
            "type": "input_text",
            "text": systemPrompt
          }
        ]
      },
      {
        "role": "user",
        "content": [
          {
            "type": "input_text",
            "text": triggerPrompt
          }
        ]
      }
    ],
    reasoning: {
      "effort": reasoningEffort
    },
    "tools": [] as any[],
    "include": [
      "reasoning.encrypted_content"
    ],
    "text": {
      "format": jsonSchema,
      "verbosity": "medium"
    }
  };

  if(webSearch) {
    requestBody.tools.push({
      "type": "web_search",
      "user_location": {
        "type": "approximate",
        "country": "CA"
      },
      "search_context_size": "medium"
    })
  }

  const r = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  const data = await r.json();
  const jsonString = data?.output.find((x: any)=>x.type=='message')?.content[0]?.text;
  const resultedObject = JSON.parse(jsonString) as T;

  return resultedObject;
}