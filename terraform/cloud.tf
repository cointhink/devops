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
  os_id = 215 #	Ubuntu 16.04
  plan_id = 201 # $5/mo,1GB ram, 25GB disk

  ipv6 = true
  private_networking = true
  ssh_key_ids = ["${vultr_ssh_key.cointhink.id}"]
}

resource "vultr_server" "cointhink_lxd_1" {
  name = "cointhink lxd 1"
  region_id = "${var.region}"
  os_id = 215 #	Ubuntu 16.04
  plan_id = 201 # $5/mo,1GB ram, 25GB disk

  ipv6 = true
  private_networking = true
  ssh_key_ids = ["${vultr_ssh_key.cointhink.id}"]
}

#resource "vultr_server" "cointhink_db_1" {
#  name = "cointhink db 1"
#  region_id = "${var.region}"
#  os_id = 179 #	CoreOS
#  plan_id = 201 # $5/mo,1GB ram, 25GB disk
#
#  ipv6 = true
#  private_networking = true
#  ssh_key_ids = ["${vultr_ssh_key.cointhink.id}"]
#  user_data = "${data.template_file.coreos_db.rendered}"
#}

resource "vultr_server" "cointhink_db_2" {
  name = "vultr-db-2"
  region_id = "${var.region}"
  os_id = 179 #	CoreOS
  plan_id = 201 # $5/mo,1GB ram, 25GB disk

  ipv6 = true
  private_networking = true
  ssh_key_ids = ["${vultr_ssh_key.cointhink.id}"]
  user_data = "${data.template_file.coreos_db2_psql.rendered}"
}

data "template_file" "coreos_db" {
  template = "${file("coreos-db1-cockroach.yaml")}"
  vars {
    ssh_key = "${vultr_ssh_key.cointhink.public_key}"
  }
}

data "template_file" "coreos_db2_psql" {
  template = "${file("coreos-db2-psql.yaml")}"
  vars {
    ssh_key = "${vultr_ssh_key.cointhink.public_key}"
  }
}
