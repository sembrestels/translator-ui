import * as React from "react";
import { useState, useEffect } from "react";
import { Box, Button, Text, Textarea, VStack, Select, useToast } from "@chakra-ui/react";
import { CopyIcon, DownloadIcon } from "@chakra-ui/icons";

const App: React.FC = () => {
  const [jsonInputs, setJsonInputs] = useState<Record<string, string>>({});
  const [mergedJson, setMergedJson] = useState<Record<string, any>>({});

  const [selectedLanguage, setSelectedLanguage] = useState("");
  const toast = useToast();


  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "zh", name: "Chinese" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "ru", name: "Russian" },
    { code: "ar", name: "Arabic" },
    { code: "pt", name: "Portuguese" },
    { code: "it", name: "Italian" },
    { code: "nl", name: "Dutch" },
    { code: "sv", name: "Swedish" },
    { code: "pl", name: "Polish" },
    { code: "he", name: "Hebrew" },
    { code: "tr", name: "Turkish" },
    { code: "da", name: "Danish" },
    { code: "fi", name: "Finnish" },
    { code: "ca", name: "Catalan" },
    { code: "fa", name: "Farsi" },
  ];

  const showToast = (message: string) => {
    toast({
      title: message,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(event.target.value);
  };

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      event.preventDefault();

      let clipboardText = "";

      if (navigator.clipboard && navigator.clipboard.readText) {
        clipboardText = await navigator.clipboard.readText();
      } else if (event.clipboardData) {
        clipboardText = event.clipboardData.getData("text");
      } else {
        console.error("Clipboard API is not supported in this browser.");
        return;
      }

      try {
        const pastedJson = JSON.parse(clipboardText);
        const newMergedJson = { ...mergedJson, ...pastedJson };
        setMergedJson(newMergedJson);
      } catch (error) {
        console.error("Pasted content is not valid JSON");
      }
      showToast("JSON pasted");
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [mergedJson, showToast]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files!;
    const filePromises = Array.from(files).map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = (e) => {
          resolve(e.target!.result as string);
        };
      });
    });

    Promise.all(filePromises).then((fileContents) => {
      const newJsonInputs: Record<string, string> = {};
      fileContents.forEach((content, index) => {
        newJsonInputs[files[index].name] = content;
      });
      setJsonInputs(newJsonInputs);
    });
  };

  const handleCopy = () => {
    const textArea = document.createElement("textarea");
    textArea.value = getCommonKeysChunk();
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("Copy");
    textArea.remove();
    showToast("JSON copied");
  };

  const handleDownloadMergedJson = () => {
    const mergedJsonString = JSON.stringify(mergedJson, null, 2);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(mergedJsonString);
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${selectedLanguage}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const getCommonKeysChunk = () => {
    const jsons = Object.values(jsonInputs).map((input) => JSON.parse(input));
    const commonKeys = jsons
      .map((json) => Object.keys(json))
      .reduce(
        (acc, keys) => acc.filter((key) => keys.includes(key)),
        jsons.length > 0 ? Object.keys(jsons[0]) : []
      )
      .filter((key) => !mergedJson.hasOwnProperty(key)) // Filter out keys that are already in mergedJson
      .slice(0, 10); // Only the first 10 keys

    let result = `Given the following chunks, can you provide a chunk for ${selectedLanguage}.json within a formatted code block, please?\n\n`;

    Object.keys(jsonInputs).forEach((fileName, fileIndex) => {
      let fileChunk = `Chunk of file ${fileName}\n{\n`;

      commonKeys.forEach((key) => {
        if (jsons[fileIndex][key]) {
          fileChunk += `  "${key}": "${jsons[fileIndex][key]}",\n`;
        }
      });

      fileChunk = fileChunk.slice(0, -2) + "\n}\n\n";
      result += fileChunk;
    });

    return result;
  };
  
  return (
    <VStack spacing={4} p={4}>
      <Text>
        1. Upload one or more JSON files containing language translation keys.
      </Text>
      <Text>
        2. Select a target language from the dropdown menu.
      </Text>
      <Text>
        3. Click the "Copy" button to copy the formatted prompt for the selected language.
      </Text>
      <Text>
        4. Go to ChatGPT, paste the copied prompt, and get the translation keys for the selected language.
      </Text>
      <Text>
        5. Copy the resulting JSON from ChatGPT and paste it back into this application.
      </Text>
      <Text>
        6. The application will automatically merge the pasted JSON and display the number of keys in the merged JSON file.
      </Text>
      <Text>
        7. Click the "Download {selectedLanguage}.json" button to download the merged JSON file.
      </Text>

      <input type="file" accept=".json" onChange={handleFileUpload} multiple />
      <Select placeholder="Select language" onChange={handleLanguageChange}>
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name}
          </option>
        ))}
      </Select>
      <Textarea value={getCommonKeysChunk()} readOnly={true} />
      <Box>
        <Button leftIcon={<CopyIcon />} onClick={handleCopy}>
          Copy
        </Button>
      </Box>
      <Text>Total keys in {selectedLanguage}.json: {Object.keys(mergedJson).length}</Text>
      <Box>
      <Button leftIcon={<DownloadIcon />} onClick={handleDownloadMergedJson}>
          Download {selectedLanguage}.json
        </Button>
      </Box>
    </VStack>
  );
};

export default App;
