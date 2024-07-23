package cmd

import (
	"os"

	"github.com/spf13/cobra"
	hosts "github.com/unstoppablemango/hosts/deploy/internal"
)

var log = hosts.NewLogger()

var rootCmd = &cobra.Command{
	Use: "deploy",
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
