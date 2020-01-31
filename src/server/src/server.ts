import {
    createConnection, Diagnostic, DiagnosticSeverity, ProposedFeatures, Range, TextDocuments, TextDocumentSyncKind, Hover
} from "vscode-languageserver";

import { Client as RTextClient } from "./rtext/client";
import * as rtext from "./rtext/protocol";
import { Context } from "./rtext/context";

// Creates the LSP connection
const connection = createConnection(ProposedFeatures.all);

// Create a manager for open text documents
const documents = new TextDocuments();

// The workspace folder this server is operating on
let workspaceFolder: string | null | undefined;

const rtextClient = new RTextClient();

let previousProblemFiles: string[] = [];
function provideDiagnostics() {
    rtextClient.loadModel().then((data) => {
        const problemFiles: string[] = [];
        data.problems.forEach((problem) => {
            const diagnostics: Diagnostic[] = [];

            function convertSeverity(severity: rtext.ProblemSeverity): DiagnosticSeverity {
                switch (severity) {
                    case rtext.ProblemSeverity.debug:
                        return DiagnosticSeverity.Hint;
                    case rtext.ProblemSeverity.error:
                    case rtext.ProblemSeverity.fatal:
                        return DiagnosticSeverity.Error;
                    case rtext.ProblemSeverity.warn:
                        return DiagnosticSeverity.Warning;
                    case rtext.ProblemSeverity.info:
                        return DiagnosticSeverity.Information;
                    default:
                        //@todo assert
                        return DiagnosticSeverity.Error;
                }
            }

            problem.problems.forEach((fileProblem) => {
                const diagnostic: Diagnostic = {
                    message: fileProblem.message,
                    range: Range.create(fileProblem.line, 0, fileProblem.line, Number.MAX_SAFE_INTEGER),
                    severity: convertSeverity(fileProblem.severity),
                };

                diagnostics.push(diagnostic);
            });
            connection.sendDiagnostics({ uri: problem.file, diagnostics });
            problemFiles.push(problem.file);
        });

        previousProblemFiles.forEach((file) => {
            if (!problemFiles.includes(file)) {
                connection.sendDiagnostics({ uri: file, diagnostics: [] });
            }
        });

        previousProblemFiles = problemFiles;
    });
}

documents.onDidOpen((event) => {
    connection.console.log(`[Server(${process.pid}) ${workspaceFolder}] Document opened: ${event.document.uri}`);
});

connection.onHover((params) => {
    const textDocument = documents.get(params.textDocument.uri);
    if (textDocument) {
        let text = textDocument.getText(Range.create(0, 0, params.position.line, Number.MAX_SAFE_INTEGER));
        let lines = text.split('\n');
        lines.pop(); // remove last `\n` added by getText
        let pos = params.position.character + 1; // column number start at 1 in RText protocol
        const ctx = Context.extract(lines, pos);
        return rtextClient.getContextInformation(ctx).then((response: rtext.ContextInformationResponse) => {
            return { contents: response.desc };
        });
    }
});

connection.onInitialize((params) => {
    workspaceFolder = params.rootPath;
    connection.console.log(`[Server(${process.pid}) ${workspaceFolder}] Started and initialize received`);

    return {
        capabilities: {
            textDocumentSync: {
                change: TextDocumentSyncKind.Full,
                openClose: true,
            },
            hoverProvider: params.initializationOptions.hoverProvider
        },
    };
});

connection.onInitialized(async () => {
    connection.console.log(`[Server(${process.pid}) ${workspaceFolder}] Initialized received`);
    if (workspaceFolder) {
        await rtextClient.start(workspaceFolder);
        setTimeout(() => provideDiagnostics(), 0);
    }
});

connection.onDidChangeWatchedFiles((params) => {
    provideDiagnostics();
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

connection.onShutdown(() => {
    rtextClient.stop();
});
