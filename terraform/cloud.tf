variable "region" {
  default = 1 # New Jersey
#  default = 4 # Seattle
}

resource "vultr_ssh_key" "cointhink" {
  name = "root ssh key"
  public_key = "${file("root_ssh_pub.key")}"
}

resource "vultr_server" "cointhink_web_1" {
  name = "cointhink web 1"
  region_id = "${var.region}"
  os_id = 231 #	Ubuntu 16.10
  plan_id = 201 # $5/mo,1GB ram, 25GB disk

  ipv6 = true
  private_networking = true
  ssh_key_ids = ["${vultr_ssh_key.cointhink.id}"]
}

resource "vultr_server" "cointhink_algo_1" {
  name = "cointhink algo 1"
  region_id = "${var.region}"
  os_id = 231 #	Ubuntu 16.10
  plan_id = 201 # $5/mo,1GB ram, 25GB disk

  ipv6 = true
  private_networking = true
  ssh_key_ids = ["${vultr_ssh_key.cointhink.id}"]
}

resource "vultr_server" "cointhink_db_1" {
  name = "cointhink db 1"
  region_id = "${var.region}"
  os_id = 179 #	CoreOS
  plan_id = 201 # $5/mo,1GB ram, 25GB disk

  ipv6 = true
  private_networking = true
  ssh_key_ids = ["${vultr_ssh_key.cointhink.id}"]
  user_data = "${data.template_file.coreos_db.rendered}"
}

data "template_file" "coreos_db" {
  template = "${file("coreos-db.yaml")}"
  vars {
    ssh_key = "${vultr_ssh_key.cointhink.public_key}"
  }
}
