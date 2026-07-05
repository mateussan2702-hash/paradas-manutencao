ALTER TABLE `ordens_servico` ADD `pessoasExecutando` int;--> statement-breakpoint
ALTER TABLE `ordens_servico` ADD `progressoOs` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `ordens_servico` ADD `tipoAtividade` varchar(32);--> statement-breakpoint
ALTER TABLE `ordens_servico` ADD `especialidade` varchar(64);--> statement-breakpoint
ALTER TABLE `ordens_servico_industrial` ADD `pessoasExecutando` int;--> statement-breakpoint
ALTER TABLE `ordens_servico_industrial` ADD `progressoOs` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `ordens_servico_industrial` ADD `tipoAtividade` varchar(32);--> statement-breakpoint
ALTER TABLE `ordens_servico_industrial` ADD `especialidade` varchar(64);--> statement-breakpoint
ALTER TABLE `ordens_servico_mina` ADD `pessoasExecutando` int;--> statement-breakpoint
ALTER TABLE `ordens_servico_mina` ADD `progressoOs` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `ordens_servico_mina` ADD `tipoAtividade` varchar(32);--> statement-breakpoint
ALTER TABLE `ordens_servico_mina` ADD `especialidade` varchar(64);