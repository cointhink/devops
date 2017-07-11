	mkdir -p vultr-cli && \
	cd vultr-cli && \
	export GOPATH=`pwd` && \
	mkdir -p src/github.com/rgl/terraform-provider-vultr && \
	git clone https://github.com/rgl/terraform-provider-vultr src/github.com/rgl/terraform-provider-vultr && \
	go get github.com/hashicorp/terraform && \
	go get github.com/JamesClonk/vultr && \
	cd src/github.com/rgl/terraform-provider-vultr && \
	go build && \
	cp terraform-provider-vultr ../../../../bin/

