export enum ProblemSeverity {
    debug, info, warn, error, fatal,
}

export interface FileProblem {
    /**
     * Message
     */
    message: string;

    severity: ProblemSeverity;

    /**
     * Line number
     */
    line: number;
}

export interface ModelProblem {
    /**
     * Fully qualifed file name
     */
    file: string;

    /**
     * An array of the file problems
     */
    problems: FileProblem[];
}

/**
 * Indicate problems which were detected during loading.
 * In order to reduce the size of the response message, problems are grouped by file.
 * The ``total_problems`` field is used to indicate the total number of problems which may be lower
 * than the number actually returned. If the total number of problems is unknown, ``total_problems``
 * should be set to -1. This may be the case when problem detection is interrupted in order to
 * limit detection effort and/or response time.
 */
export interface LoadModelResponse {
    /**
     * Number of total problems or -1
     */
    total_problems: number;

    /**
     * An array of the problems grouped by file
     */
    problems: ModelProblem[];
}

/**
 * Version information. Introduced in version 1.
 * The backend supporting protocool version 0 only responds with an 'Unknown Command Error'.
 */
export interface VersionResponse {
    version: number;
}

/**
 * Textual description to be shown to the user
 */
export interface ContextInformationResponse {
    desc: string;
}
