CREATE TABLE `imported_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`fileType` enum('csv','json','parquet') NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`byteSize` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `imported_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceFileId` int,
	`title` varchar(180) NOT NULL,
	`category` enum('analytics','quality','pipeline','ai_product') NOT NULL,
	`status` enum('idea','building','review','complete') NOT NULL DEFAULT 'idea',
	`brief` text NOT NULL,
	`deliverable` text NOT NULL,
	`evidence` text NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolio_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `imported_files` ADD CONSTRAINT `imported_files_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolio_projects` ADD CONSTRAINT `portfolio_projects_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolio_projects` ADD CONSTRAINT `portfolio_projects_sourceFileId_imported_files_id_fk` FOREIGN KEY (`sourceFileId`) REFERENCES `imported_files`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `imported_files_user_created_idx` ON `imported_files` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `portfolio_projects_user_updated_idx` ON `portfolio_projects` (`userId`,`updatedAt`);