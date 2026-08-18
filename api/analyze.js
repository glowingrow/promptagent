export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { scenario } = req.body;
    if (!scenario) {
        return res.status(400).json({ error: '시나리오가 입력되지 않았습니다.' });
    }

    const systemInstruction = `
당신은 AI 모델 큐레이터이자 최고 수준의 프롬프트 엔지니어입니다.
사용자가 제공한 시나리오를 심층 분석하여 가장 적합한 최신 AI 도구(텍스트, 코딩, 이미지, 비디오, 음성 등 모든 생성형 AI 중 선택)를 추천하고, 해당 도구에 바로 넣어서 사용할 수 있는 완성형 프롬프트를 작성해주세요.

반드시 아래 JSON 포맷으로만 답변하세요:
{
  "modelName": "추천 AI 이름 (예: Claude 3.5 Sonnet, Cursor, Midjourney v6, ChatGPT-4o 등)",
  "siteUrl": "해당 AI 공식 웹사이트 링크",
  "reason": "이 시나리오에 이 모델을 추천한 핵심 이유 (2~3문장)",
  "generatedPrompt": "전문가 수준으로 역할, 맥락, 제약사항, 출력 형식이 완벽히 포함된 프롬프트"
}
`;

    try {
        // Vercel 환경변수에 등록될 Gemini API Key를 불러옵니다.
        const apiKey = process.env.GEMINI_API_KEY;
        
        // 빠르고 저렴한 gemini-1.5-flash 모델을 사용합니다.
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                },
                contents: [
                    {
                        role: "user",
                        parts: [{ text: `시나리오: ${scenario}` }]
                    }
                ],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.7
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini API Error:', data);
            throw new Error('Gemini API 요청에 실패했습니다.');
        }
        
        const textResult = data.candidates[0].content.parts[0].text;
        const result = JSON.parse(textResult);
        
        return res.status(200).json(result);
        
    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ error: 'AI 분석 중 오류가 발생했습니다.' });
    }
}