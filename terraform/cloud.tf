resource "vultr_ssh_key" "cointhink" {
  name = "root ssh key"
  public_key = "${file("root_ssh.pub")}"
}

