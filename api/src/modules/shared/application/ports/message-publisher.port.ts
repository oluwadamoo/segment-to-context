export interface MessagePublisherPort<T> {
    publish(message: T, options?: { orderingKey?: string; attributes?: Record<string, string> }): Promise<string>;
}