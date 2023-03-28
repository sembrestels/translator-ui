const getCommonKeysChunk = (uploadedJsonFiles: Record<string, string>, selectedLanguage: string, translatedJson: Record<string, any>) => {
    const jsons = Object.values(uploadedJsonFiles).map((input) => JSON.parse(input));

    console.log(Object.keys(translatedJson).length, 'translatedJson length')

    const commonKeys = jsons
      .map((json) => Object.keys(json))
      .reduce((acc, keys) => acc.filter((key) => keys.includes(key)), Object.keys(jsons[0] || {}))
      .filter((key) => !translatedJson.hasOwnProperty(key))
      .sort()
      .slice(0, 10);

    console.log(commonKeys, 'commonKeys')
  
    const chunks = Object.entries(uploadedJsonFiles).map(([fileName], index) => {
      const keyValues = commonKeys.map((key) => `  "${key}": "${jsons[index][key]}"`).join(',\n');
      return `Chunk of file ${fileName}\n{\n${keyValues}\n}`;
    });
  
    return `Given the following chunks, can you provide the JSON for the chunk of the language ${selectedLanguage}?\n\n${chunks.join('\n\n')}`;
  };
  
export async function getTranslation(openai: any, uploadedJsonFiles: Record<string, string>, selectedLanguage: string, translatedJson: Record<string, any>): Promise<Record<string, any>> {

    const prompt = getCommonKeysChunk(uploadedJsonFiles, selectedLanguage, translatedJson)
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 1000,
        temperature: 0.3,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
    });

    const resultText = response.data.choices[0].text;
    const start = resultText?.indexOf("{");
    const end = resultText?.lastIndexOf("}");
    if (!resultText || start === -1 || end === -1) {
        throw new Error("No JSON found");
    }
    const jsonText = resultText.substring(start, end + 1);
    const parsedJson: Record<string, any> = JSON.parse(jsonText || "{}");
    const newTranslatedJson: Record<string, any> = { ...translatedJson, ...parsedJson };
    return newTranslatedJson;
}

export async function getTranslations(openai: any, uploadedJsonFiles: Record<string, string>, selectedLanguage: string, translatedJson: Record<string, any>) {
    while(true) {
        try {
            translatedJson = await getTranslation(openai, uploadedJsonFiles, selectedLanguage, translatedJson);
            console.log(`Translated keys: ${Object.keys(translatedJson).length}`);
            await new Promise((resolve) => setTimeout(resolve, 15000));
        } catch (e) {
            return translatedJson;
        }
    }
}