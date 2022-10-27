export class APIConfig {
    public maxDepth = 6
    public referenceDefinedTypes = false

    public setReferenceDefinedTypes(): this {
        this.referenceDefinedTypes = true
        return this
    }
}
