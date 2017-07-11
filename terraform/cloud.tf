resource "vultr_ssh_key" "cointhink" {
  name = "root ssh key"
  public_key = "${file("root_ssh.key")}"
}

resource "vultr_server" "cointhink_web_1" {
  name = "cointhink web 1"
  region_id = 4 # Seattle
  os_id = 231 #	Ubuntu 16.10
  plan_id = 201 # $5/mo,1GB ram, 25GB disk

  ipv6 = true
  private_networking = true
  ssh_key_ids = ["${vultr_ssh_key.cointhink.id}"]
}

resource "vultr_server" "cointhink_algo_1" {
  name = "cointhink algo 1"
  region_id = 4 # Seattle
  os_id = 231 #	Ubuntu 16.10
  plan_id = 201 # $5/mo,1GB ram, 25GB disk

  ipv6 = true
  private_networking = true
  ssh_key_ids = ["${vultr_ssh_key.cointhink.id}"]
}

resource "vultr_server" "cointhink_db_1" {
  name = "cointhink db 1"
  region_id = 4 # Seattle
  os_id = 231 #	Ubuntu 16.10
  plan_id = 201 # $5/mo,1GB ram, 25GB disk

  ipv6 = true
  private_networking = true
  ssh_key_ids = ["${vultr_ssh_key.cointhink.id}"]
}
