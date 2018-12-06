/* --------------------------------------------------------------------------------------------
* Copyright (c) Microsoft Corporation. All rights reserved.
* Licensed under the MIT License. See License.txt in the project root for license information.
* ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
  SettingMonitor
} from 'vscode-languageclient';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  // The server is implemented in node
  let serverModule = context.asAbsolutePath(
    path.join('server', 'out', 'server.js')
  );
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  let serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions
    }
  };

  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
		diagnosticCollectionName: 'htmllint',
    // Register the server for plain html documents
    documentSelector: [{ scheme: 'file', language: 'html' }],
    synchronize: {
      configurationSection: 'htmllint',
      // Notify the server about file changes to '.htmllintrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/.htmllintrc')
    }
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    'htmllint',
    'Htmllint Language Server',
    serverOptions,
    clientOptions
  );

  // let noConfigFolders = folders.filter(folder => {
  // 	let configFiles = ['.eslintrc.js', '.eslintrc.yaml', '.eslintrc.yml', '.eslintrc', '.eslintrc.json'];
  // 	for (let configFile of configFiles) {
  // 		if (fs.existsSync(path.join(folder.uri.fsPath, configFile))) {
  // 			return false;
  // 		}
  // 	}
  // 	return true;
  // });
  // if (noConfigFolders.length === 0) {
  // 	if (folders.length === 1) {
  // 		Window.showInformationMessage('The workspace already contains an ESLint configuration file.');
  // 	} else {
  // 		Window.showInformationMessage('All workspace folders already contain an ESLint configuration file.');
  // 	}
  // 	return;
  // }

  // Start the client. This will also launch the server
  // client.start();

  context.subscriptions.push(new SettingMonitor(client, 'htmllint.enable').start());
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
