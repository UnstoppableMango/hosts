package cmd

import (
	"os"

	"github.com/pulumi/pulumi/sdk/v3/go/auto"
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use: "echo",
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := cmd.Context()
		work, err := auto.NewLocalWorkspace(ctx)
		if err != nil {
			return err
		}

		err = work.SelectStack(ctx, "cp")
		if err != nil {
			return err
		}

		return nil
	},
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
