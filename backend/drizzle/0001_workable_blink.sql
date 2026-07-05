CREATE TABLE `ordens_servico` (
	`id` varchar(32) NOT NULL,
	`paradaId` varchar(32) NOT NULL,
	`numeroOrdem` varchar(64),
	`descricao` text NOT NULL,
	`homemDia` int,
	`horaDia` int,
	`dataPrevInicio` varchar(10) NOT NULL,
	`dataPrevFim` varchar(10) NOT NULL,
	`horaPrevInicio` varchar(5),
	`horaPrevFim` varchar(5),
	`dataRealInicio` varchar(10),
	`dataRealFim` varchar(10),
	`horaRealInicio` varchar(5),
	`horaRealFim` varchar(5),
	`peso` int NOT NULL DEFAULT 0,
	`concluida` boolean NOT NULL DEFAULT false,
	`observacao` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ordens_servico_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paradas` (
	`id` varchar(32) NOT NULL,
	`equipamento` varchar(255) NOT NULL,
	`descricao` text,
	`dataPrevInicio` varchar(10) NOT NULL,
	`dataPrevFim` varchar(10) NOT NULL,
	`horaPrevInicio` varchar(5),
	`horaPrevFim` varchar(5),
	`dataRealInicio` varchar(10),
	`dataRealFim` varchar(10),
	`horaRealInicio` varchar(5),
	`horaRealFim` varchar(5),
	`criadaEm` varchar(30) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paradas_id` PRIMARY KEY(`id`)
);
