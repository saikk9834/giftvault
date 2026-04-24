CREATE TABLE `friends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requesterId` int NOT NULL,
	`addresseeId` int NOT NULL,
	`status` enum('pending','accepted') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `friends_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`photos` text NOT NULL DEFAULT ('[]'),
	`dateReceived` varchar(32) NOT NULL,
	`occasion` enum('birthday','anniversary','christmas','wedding','graduation','valentines','mothers_day','fathers_day','hanukkah','other') NOT NULL DEFAULT 'other',
	`tags` text NOT NULL DEFAULT ('[]'),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surprises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`senderName` varchar(255) NOT NULL,
	`senderAvatar` text,
	`recipientId` int NOT NULL,
	`recipientName` varchar(255) NOT NULL,
	`giftContent` text NOT NULL,
	`giftImage` text,
	`puzzle` text NOT NULL,
	`puzzleImage` text,
	`answer` varchar(255) NOT NULL,
	`deliveryDate` timestamp NOT NULL,
	`isUnlocked` boolean NOT NULL DEFAULT false,
	`unlockedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `surprises_id` PRIMARY KEY(`id`)
);
