import type { ReplyProvider } from "./ReplyProvider";
import { mergedReplyProvider } from "./MergedReplyProvider";

export const replyProvider: ReplyProvider = mergedReplyProvider;
