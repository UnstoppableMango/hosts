package cmd

import (
	"os"

	"github.com/pulumi/pulumi/sdk/v3/go/auto"
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use: "deploy",
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := cmd.Context()

		tmp, err := os.MkdirTemp(os.TempDir(), "")
		if err != nil {
			return err
		}

		workspace, err := auto.NewLocalWorkspace(ctx,
			auto.WorkDir(""),
		)
		if err != nil {
			return err
		}

		err = workspace.SelectStack(ctx, "cp")
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
