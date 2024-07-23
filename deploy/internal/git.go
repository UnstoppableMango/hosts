package hosts

import (
	"os/exec"
	"strings"

	"github.com/go-git/go-git/v5"
)

func CurrentRepo() (*git.Repository, error) {
	path, err := RepoPath()
	if err != nil {
		return nil, err
	}

	return git.PlainOpen(path)
}

// https://github.com/Integralist/go-findroot/
func RepoPath() (string, error) {
	path, err := exec.Command("git", "rev-parse", "--show-toplevel").Output()
	if err != nil {
		return "", err
	}

	return strings.TrimSpace(string(path)), nil
}
