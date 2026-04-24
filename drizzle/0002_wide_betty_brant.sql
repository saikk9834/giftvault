ALTER TABLE `gifts` MODIFY COLUMN `photos` varchar(2048) NOT NULL DEFAULT '[]';--> statement-breakpoint
ALTER TABLE `gifts` MODIFY COLUMN `tags` varchar(1024) NOT NULL DEFAULT '[]';