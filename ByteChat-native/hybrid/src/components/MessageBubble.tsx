import { ChatMessage } from "../core/types";
import { toneColor } from "../utils/theme";
import { Box, Flex, Text } from "@chakra-ui/react";

export function MessageBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  return (
    <Box
      data-mid={msg.id}
      maxW="96%"
      alignSelf={isMe ? "flex-end" : "flex-start"}
      bg={isMe ? "#eaf2ff" : "#f7f8fa"}
      border="1px solid"
      borderColor="gray.200"
      borderRadius="14px"
      p={3}
    >
      <Flex justify="space-between" mb={1} fontSize="xs" color="gray.500">
        <Text>{msg.senderId || "unknown"}</Text>
        <Text>{new Date(msg.createdAt || Date.now()).toLocaleTimeString()}</Text>
      </Flex>
      <Text fontSize="sm" color="gray.800" whiteSpace="pre-wrap">
        {msg.content || ""}
      </Text>
      {msg.localStatus && (
        <Text fontSize="xs" mt={1} color={toneColor(msg.localStatus === "ok" ? "ok" : msg.localStatus === "fail" ? "fail" : "muted")}>
          {msg.localStatus === "ok" ? "已送达" : msg.localStatus === "fail" ? "失败" : "发送中"}
        </Text>
      )}
    </Box>
  );
}
