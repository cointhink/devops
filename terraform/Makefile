plan: vultr-cli/bin root_ssh.key
	./vultr-cli/bin/terraform plan

apply: vultr-cli/bin root_ssh.key
	./vultr-cli/bin/terraform apply
	./dns-update.sh

destroy: vultr-cli/bin root_ssh.key
	./vultr-cli/bin/terraform destroy

dns:
	dns-update.sh

vultr-cli/bin:
	env PATH=${PATH} ./build.sh
	./vultr-cli/bin/terraform init

root_ssh.key:
	ssh-keygen -t ed25519 -C 'root@cointhink' -N '' -f root_ssh.key
	mv root_ssh.key.pub root_ssh_pub.key
