mkdir -p vultr-cli
cd vultr-cli
export GOPATH=`pwd`

#build errors with .v0
#echo go get gopkg.in/hashicorp/terraform.v0
#go get gopkg.in/hashicorp/terraform.v0

echo go get -d github.com/hashicorp/terraform
go get -d github.com/hashicorp/terraform
echo git checkout v0.9.11
cd src/github.com/hashicorp/terraform
git checkout v0.9.11
cd ../../../..
echo go build terraform
go build -o bin/terraform github.com/hashicorp/terraform

echo go get github.com/JamesClonk/vultr
go get github.com/JamesClonk/vultr

echo git clone terraform provider vultr
mkdir -p src/github.com/rgl/terraform-provider-vultr
git clone https://github.com/rgl/terraform-provider-vultr src/github.com/rgl/terraform-provider-vultr
echo go build terraform provider vultr
go build -o bin/terraform-provider-vultr github.com/rgl/terraform-provider-vultr
