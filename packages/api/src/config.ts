import { APIConfig } from "./types"

export function configDefaults(config: Partial<APIConfig> = {}): APIConfig {
    return {
        maxDepth: 6,
        referenceDefinedTypes: false,
        ...config,
    }
}
