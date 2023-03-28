import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import App from "./App";

const rootElement = document.getElementById("root");

const root = ReactDOMClient.createRoot(rootElement as HTMLElement);
root.render(
  <React.StrictMode>
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
