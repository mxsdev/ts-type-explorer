import { APIConfig } from "./types"

export function configDefaults(config: Partial<APIConfig> = {}): APIConfig {
    const res = {
        ...config,
        maxDepth: config.maxDepth ?? 6,
        referenceDefinedTypes: config.referenceDefinedTypes ?? false,
    }

    return res
}
