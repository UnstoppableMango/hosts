package cmd

import (
	"os"

	"github.com/spf13/cobra"
	hosts "github.com/unstoppablemango/hosts/deploy/internal"
)

var (
	log           = hosts.NewLogger()
	controlplanes = []string{"pik8s4", "pik8s5", "pik8s6"}
	workers       = []string{"zeus", "gaea", "vrk8s1", "pik8s8"}
)

var rootCmd = &cobra.Command{
	Use: "deploy",
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
