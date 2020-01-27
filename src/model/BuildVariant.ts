import ProjectMetaFile from "./ProjectMetaFile";

/**
 * A BuildVariant describes all necessary parameters
 * to call bake for a distinct build.
 *
 * Currently a build run is uniquly defined by
 * - project
 * - config
 * - adapt config
 */
export interface BuildVariant {
    project: string;
    config: string;
    adapt: string;
}

export function createBuildVariantFrom(project: ProjectMetaFile, target: string): BuildVariant {
    const relativePath = project.getPathInWorkspace();
    return {
        project: relativePath,
        config: target,
        adapt: null,
    };
}
