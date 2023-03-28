import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Box, Button, Text, VStack, Select, useToast, Input } from "@chakra-ui/react";
import { ArrowForwardIcon, DownloadIcon, CloseIcon } from "@chakra-ui/icons";

import { getTranslations } from "./utils/translation";
import { Configuration, OpenAIApi } from "openai";

const App: React.FC = () => {
  const [uploadedJsonFiles, setJsonInputs] = useState<Record<string, string>>({});
  const [translatedJson, setMergedJson] = useState<Record<string, any>>({});

  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [apiKey, setApiKey] = useState(process.env.REACT_APP_OPENAI_API_KEY);
  const [openai, setOpenai] = useState<OpenAIApi | null>(null);
  // const [isTranslating, setIsTranslating] = useState(false);

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

  useEffect(() => {
    if (apiKey) {
      const configuration = new Configuration({ apiKey });
      setOpenai(new OpenAIApi(configuration));
    }
  }, [apiKey]);

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
        const newTranslatedJson = { ...translatedJson, ...pastedJson };
        setMergedJson(newTranslatedJson);
      } catch (error) {
        console.error("Pasted content is not valid JSON");
      }
      showToast("JSON pasted");
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [translatedJson, showToast]);

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
      const newUploadedJsonFiles: Record<string, string> = {};
      fileContents.forEach((content, index) => {
        newUploadedJsonFiles[files[index].name] = content;
      });
      setJsonInputs(newUploadedJsonFiles);
    });
  };

  const handleTranslate = async () => {
    const translations = await getTranslations(openai, uploadedJsonFiles, selectedLanguage, translatedJson);
    setMergedJson(translations);
  };
  
  return (
    <VStack spacing={4} p={4}>
      <Text fontSize="4xl">JSON Translator</Text>
      <Instructions />
      <Text>OpenAI API Key</Text>
      <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
      <Text>Upload JSON files</Text>
      <FileUploader onFileUpload={handleFileUpload} />
      <Text>Translate to:</Text>
      <LanguageSelector languages={languages} onChange={handleLanguageChange} />
      
      <TranslationControls
        handleTranslate={handleTranslate}
      />
      
      <Text>Total keys in {selectedLanguage}.json: {Object.keys(translatedJson).length}</Text>
      <Box>
      <DownloadButton selectedLanguage={selectedLanguage} translatedJson={translatedJson} />
      </Box>
    </VStack>
  );
};

const Instructions = () => {
  return (
    <>
      <Text>
        1. Upload one or more JSON files containing language translation keys.
      </Text>
      <Text>
        2. Select a target language from the dropdown menu.
      </Text>
      <Text>
        3. Click the "Translate" button to translate to start the translation process.
      </Text>
      <Text>
        4. When it's finished, click the "Download" button to download the merged JSON file.
      </Text>
    </>
  );
};

const FileUploader = ({ onFileUpload }: any) => {
  return (
    <input type="file" accept=".json" onChange={onFileUpload} multiple />
  );
};

const LanguageSelector = ({ languages, onChange }: any) => {
  return (
    <Select placeholder="Select language" onChange={onChange}>
      {languages.map((language: {code: string, name: string}) => (
        <option key={language.code} value={language.code}>
          {language.name}
        </option>
      ))}
    </Select>
  );
};

const TranslationControls = ({ handleTranslate }: any) => {
  return (
    <Box>
      <Button
        leftIcon={
          <ArrowForwardIcon /> 
        }
        onClick={ handleTranslate}
      >
        Translate
      </Button>
    </Box>
  );
};

const DownloadButton = ({ translatedJson, selectedLanguage }: any) => {
  const handleDownloadMergedJson = () => {
    const mergedJsonString = JSON.stringify(translatedJson, null, 2);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(mergedJsonString);
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${selectedLanguage}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <Button leftIcon={<DownloadIcon />} onClick={handleDownloadMergedJson}>
      Download
    </Button>
  );
};

export default App;
