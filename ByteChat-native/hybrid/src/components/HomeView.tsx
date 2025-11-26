import { HomeProps } from "../core/types";
import { Box, Button, Flex, Heading, Input, SimpleGrid, Stack, Tag, Text } from "@chakra-ui/react";

export function HomeView({
  userId,
  wsUrl,
  roomId,
  roomList,
  onChangeUser,
  onChangeWs,
  onChangeRoom,
  onJoin,
}: HomeProps) {
  return (
    <Stack spacing={4} p={4}>
      <Stack spacing={1}>
        <Heading size="md">ByteChat</Heading>
        <Text fontSize="sm" color="gray.600">
          配置你的用户和房间，点击加入开始聊天
        </Text>
      </Stack>

      <Box bg="white" p={4} rounded="lg" shadow="md" border="1px" borderColor="gray.100">
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
          <Stack spacing={1}>
            <Text fontSize="sm" color="gray.600">
              用户 ID
            </Text>
            <Input
              value={userId}
              onChange={(e) => onChangeUser(e.target.value)}
              placeholder="u-123"
            />
          </Stack>
          <Stack spacing={1}>
            <Text fontSize="sm" color="gray.600">
              WebSocket 地址
            </Text>
            <Input
              value={wsUrl}
              onChange={(e) => onChangeWs(e.target.value)}
              placeholder="ws://10.0.2.2:3000/ws"
            />
          </Stack>
          <Stack spacing={1}>
            <Text fontSize="sm" color="gray.600">
              房间 ID
            </Text>
            <Input
              value={roomId}
              onChange={(e) => onChangeRoom(e.target.value)}
              placeholder="lobby"
            />
          </Stack>
        </SimpleGrid>
        <Flex justify="flex-end" mt={3}>
          <Button colorScheme="blue" onClick={() => onJoin(roomId)}>
            加入聊天
          </Button>
        </Flex>
      </Box>

      <Box bg="white" p={4} rounded="lg" shadow="md" border="1px" borderColor="gray.100">
        <Flex align="center" mb={2} gap={2}>
          <Tag colorScheme="blue" size="sm">
            聊天室
          </Tag>
          <Text fontSize="sm" color="gray.600">
            点击直接进入
          </Text>
        </Flex>
        <Flex wrap="wrap" gap={2}>
          {roomList.map((r) => (
            <Button
              key={r}
              variant="outline"
              size="sm"
              onClick={() => onJoin(r)}
              colorScheme="blue"
            >
              {r}
            </Button>
          ))}
        </Flex>
      </Box>
    </Stack>
  );
}
