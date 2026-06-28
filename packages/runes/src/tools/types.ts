import type { Repository } from "../db/repository";

export interface ToolDeps {
	repository: Repository;
	projectSlug: string;
	projectId: number;
}
