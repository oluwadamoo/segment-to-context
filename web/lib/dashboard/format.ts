export function getUserInitials(userId: string) {
    return `U${userId}`.slice(0, 2);
}

export function formatLastAnalyzed(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatTimestamp(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}
