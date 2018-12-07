/* --------------------------------------------------------------------------------------------
* Copyright (c) Microsoft Corporation. All rights reserved.
* Licensed under the MIT License. See License.txt in the project root for license information.
* ------------------------------------------------------------------------------------------ */

import {
  createConnection,
  TextDocuments,
  TextDocument,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  Position,
  Range,
  Files
} from 'vscode-languageserver';
import * as htmllint from 'htmllint'; 
import * as pkgDir from 'pkg-dir';
import * as path from 'path';
import * as fs from 'fs';
// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
  let capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  // If not, we will fall back using global settings
  hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
  hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
  hasDiagnosticRelatedInformationCapability =
    !!(capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation);

  return {
    capabilities: {
      textDocumentSync: documents.syncKind,
      // Tell the client that the server supports code completion
      completionProvider: {
        resolveProvider: true
      }
    }
  };
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined
    );
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(_event => {
      connection.console.log('Workspace folder change event received.');
    });
  }
});

// The example settings
interface ExampleSettings {
  maxNumberOfProblems: number;
}
interface IssueData { 
  attribute?: string; // E001, E011 
  /* E011 */
  format?: string; 
  value?: string; 
  /* E023 */ 
  chars?: string; 
  desc?: string; 
  part?: string; 
  /* E036 */ 
  width?: number; 
  /* E037 */ 
  limit?: number; 
} 

interface Issue { 
  code: string; 
  column: number; 
  line: number; 

  rule: string; 
  data: IssueData; 
  msg: string;
} 

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = <ExampleSettings>(
      (change.settings.languageServerExample || defaultSettings)
    );
  }

  // Revalidate all open text documents
  documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: 'htmllint'
    });
    documentSettings.set(resource, result);
  }
  return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
  documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
  validateTextDocument(change.document);
});

async function getLocaleConfig(documentPath) {
  let configPath = path.join(path.parse(documentPath).dir, '.htmllintrc');
  if (fs.existsSync(configPath) === false) {
    configPath = path.join(await pkgDir(documentPath), '.htmllintrc');
  }
  return fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
}

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
    // In this simple example we get the settings for every validate run.
  let settings = await getDocumentSettings(textDocument.uri);
  let options = await getLocaleConfig(Files.uriToFilePath(textDocument.uri));
  // settings.config
  // The validator creates diagnostics for all uppercase words length 2 and more
  let text = textDocument.getText();
  let pattern = /\b[A-Z]{2,}\b/g;
  let m: RegExpExecArray | null;

  let problems = 0;
  let diagnostics: Diagnostic[] = [];

  const issues :Issue[] = await htmllint(text, options);

  issues.forEach((issue: Issue) => {
    const start = Position.create(issue.line - 1, 0); 
    const end = Position.create(issue.line, 0); 
    const range = Range.create(start, end); 
    const line = textDocument.getText(range); 
    let diagnostic: Diagnostic = { 
      severity: DiagnosticSeverity.Error, 
      range: { 
        start: Position.create(issue.line, issue.column), 
        end: Position.create(issue.line, issue.column + 1) 
      }, 
      code: issue.rule,
      source: 'htmllint',
      message: generateIssueMessage(issue)
    };
    diagnostics.push(diagnostic);
  });

  // Send the computed diagnostics to VSCode.
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}
connection.onDidChangeWatchedFiles(_change => {
  // changes globalConfig
  // need to load config once before ^^
  documents.all().forEach(file => validateTextDocument(file));
  // Monitored files have change in VSCode
  connection.console.log('We received an file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
  (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    // The pass parameter contains the position of the text document in
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    // Return completion of htmllint rules
    return [
      // {
      //   label: 'TypeScript',
      //   kind: CompletionItemKind.Text,
      //   data: 1
      // },
      // {
      //   label: 'JavaScript',
      //   kind: CompletionItemKind.Text,
      //   data: 2
      // }
    ];
  }
);

// This handler resolve additional information for the item selected in
// the completion list.
// connection.onCompletionResolve(
//   (item: CompletionItem): CompletionItem => {
//     if (item.data === 1) {
//       (item.detail = 'TypeScript details'),
//         (item.documentation = 'TypeScript documentation');
//     } else if (item.data === 2) {
//       (item.detail = 'JavaScript details'),
//         (item.documentation = 'JavaScript documentation');
//     }
//     return item;
//   }
// );

connection.onDidOpenTextDocument((params) => {
  debugger
  // A text document got opened in VSCode.
  // params.uri uniquely identifies the document. For documents store on disk this is a file URI.
  // params.text the initial full content of the document.
  connection.console.log(`${params.textDocument.uri} opened.`);
});
connection.onDidChangeTextDocument((params) => {
  debugger
  // The content of a text document did change in VSCode.
  // params.uri uniquely identifies the document.
  // params.contentChanges describe the content changes to the document.
  connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});
connection.onDidCloseTextDocument((params) => {
  debugger
  // A text document got closed in VSCode.
  // params.uri uniquely identifies the document.
  connection.console.log(`${params.textDocument.uri} closed.`);
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

function generateIssueMessage(issue: Issue) {
  switch(issue.code) { 
    case 'E001': 
      return `The attribut "${issue.data.attribute}" is banned`; 
    case 'E003': 
      return `The attribut "${issue.data.attribute}" is duplicated`; 
    case 'E011': 
      return `Value "${issue.data.value}" of attribut "${issue.data.attribute}" does not respect the format '${issue.data.format}'`; 
    case 'E036': 
      return `Wrong indentation, expected indentation of ${issue.data.width}`; 
    case 'E037': 
      return `Only ${issue.data.limit} attributes per line are permitted`; 
    default:
      return issue.msg || htmllint.messages.renderIssue(issue); 
  } 
}
